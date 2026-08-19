import {
  onSchedule,
} from "firebase-functions/v2/scheduler";

import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import {
  db,
} from "../core/firebase-admin";

import {
  createArchiveRecord,
} from "../core/archive-record";


const DAY_MS =
    24 * 60 * 60 * 1000;

const TWO_DAYS_MS =
    2 * DAY_MS;

const SEVEN_DAYS_MS =
    7 * DAY_MS;

const NINETY_DAYS_MS =
    90 * DAY_MS;


/* =========================================================
     SHARED LIFECYCLE RUNNER
  ========================================================= */

export async function runContentLifecycle():
  Promise<void> {
  const now =
      Timestamp.now();

  console.log(
    "Starting TalentGoldPlus content lifecycle.",
    now.toDate()
  );


  await Promise.all([

    processEvents(
      now
    ),

    processMarketplace(
      now
    ),

    processOpportunities(
      now
    ),

    processFundraisers(
      now
    ),

  ]);


  console.log(
    "TalentGoldPlus content lifecycle complete."
  );
}


/* =========================================================
     PRODUCTION SCHEDULE

     Runs every hour.
  ========================================================= */

export const processContentLifecycle =
    onSchedule(
      {
        schedule:
          "every 60 minutes",

        timeZone:
          "Europe/London",
      },

      async () => {
        await runContentLifecycle();
      }
    );


/* =========================================================
     EVENTS

     published
     → endDate
     → wait 2 days
     → archived
  ========================================================= */

async function processEvents(
  now: Timestamp
) {
  const snapshot =
      await db
        .collection(
          "events"
        )
        .where(
          "status",
          "==",
          "published"
        )
        .get();


  for (
    const eventDocument
    of snapshot.docs
  ) {
    const data =
        eventDocument.data();


    const endDate =
        timestampToMillis(
          data.endDate
        );


    if (
      !endDate
    ) {
      continue;
    }


    const archiveTime =
        endDate +
        TWO_DAYS_MS;


    if (
      now.toMillis() <
        archiveTime
    ) {
      continue;
    }


    await archiveDocument({

      collectionName:
          "events",

      documentId:
          eventDocument.id,

      data,

      previousStatus:
          "published",

      reason:
          "event_expired",

    });
  }
}


/* =========================================================
     MARKETPLACE

     approved
     → expiresAt if available

     OR

     approvedAt + 90 days

     → expired
     → 7-day renewal window
     → archived
  ========================================================= */

async function processMarketplace(
  now: Timestamp
) {
  await expireMarketplaceListings(
    now
  );


  await archiveExpiredMarketplaceListings(
    now
  );
}


/* =========================================================
     MARKETPLACE APPROVED → EXPIRED
  ========================================================= */

async function expireMarketplaceListings(
  now: Timestamp
) {
  const snapshot =
      await db
        .collection(
          "marketplaceListings"
        )
        .where(
          "status",
          "==",
          "approved"
        )
        .get();


  for (
    const listingDocument
    of snapshot.docs
  ) {
    const data =
        listingDocument.data();


    let expiryTime =
        timestampToMillis(
          data.expiresAt
        );


    /*
        Older listings do not yet
        have expiresAt.

        Use approvedAt + 90 days
        as the temporary default.
      */

    if (
      !expiryTime
    ) {
      const approvedTime =
          timestampToMillis(
            data.approvedAt
          );


      if (
        !approvedTime
      ) {
        continue;
      }


      expiryTime =
          approvedTime +
          NINETY_DAYS_MS;
    }


    if (
      now.toMillis() <
        expiryTime
    ) {
      continue;
    }


    const batch =
        db.batch();


    batch.update(
      listingDocument.ref,
      {

        status:
            "expired",

        expiredAt:
            FieldValue.serverTimestamp(),

        updatedAt:
            FieldValue.serverTimestamp(),

      }
    );


    /* =========================
         AUDIT
      ========================= */

    const auditReference =
        db
          .collection(
            "auditLogs"
          )
          .doc();


    batch.set(
      auditReference,
      {

        action:
            "marketplace_listing_expired",

        itemId:
            listingDocument.id,

        collectionName:
            "marketplaceListings",

        previousStatus:
            "approved",

        newStatus:
            "expired",

        performedBy:
            "system",

        performedByRole:
            "system",

        createdAt:
            FieldValue.serverTimestamp(),

      }
    );


    /* =========================
         NOTIFICATION
      ========================= */

    const ownerId =
        getOwnerId(
          data
        );


    if (
      ownerId
    ) {
      const notificationReference =
          db
            .collection(
              "notifications"
            )
            .doc();


      batch.set(
        notificationReference,
        {

          userId:
              ownerId,

          type:
              "marketplace_listing_expired",

          title:
              "Marketplace listing expired",

          message:
              "Your Marketplace listing has expired. You have 7 days to renew it before it is archived.",

          itemId:
              listingDocument.id,

          collectionName:
              "marketplaceListings",

          read:
              false,

          createdAt:
              FieldValue.serverTimestamp(),

        }
      );
    }


    await batch.commit();
  }
}


/* =========================================================
     MARKETPLACE EXPIRED → ARCHIVED
  ========================================================= */

async function archiveExpiredMarketplaceListings(
  now: Timestamp
) {
  const snapshot =
      await db
        .collection(
          "marketplaceListings"
        )
        .where(
          "status",
          "==",
          "expired"
        )
        .get();


  for (
    const listingDocument
    of snapshot.docs
  ) {
    const data =
        listingDocument.data();


    const expiredTime =
        timestampToMillis(
          data.expiredAt
        );


    if (
      !expiredTime
    ) {
      continue;
    }


    if (
      now.toMillis() <
        expiredTime +
        SEVEN_DAYS_MS
    ) {
      continue;
    }


    await archiveDocument({

      collectionName:
          "marketplaceListings",

      documentId:
          listingDocument.id,

      data,

      previousStatus:
          "expired",

      reason:
          "marketplace_expired",

    });
  }
}


/* =========================================================
     OPPORTUNITIES

     Actual field:
     closingDate = "YYYY-MM-DD"

     approved
     → closing date
     → wait 2 days
     → archived
  ========================================================= */

async function processOpportunities(
  now: Timestamp
) {
  const snapshot =
      await db
        .collection(
          "opportunities"
        )
        .where(
          "status",
          "==",
          "approved"
        )
        .get();


  for (
    const opportunityDocument
    of snapshot.docs
  ) {
    const data =
        opportunityDocument.data();


    const closingTime =
        dateStringToMillis(
          data.closingDate
        );


    if (
      !closingTime
    ) {
      continue;
    }


    if (
      now.toMillis() <
        closingTime +
        TWO_DAYS_MS
    ) {
      continue;
    }


    await archiveDocument({

      collectionName:
          "opportunities",

      documentId:
          opportunityDocument.id,

      data,

      previousStatus:
          "approved",

      reason:
          "opportunity_expired",

    });
  }
}


/* =========================================================
     FUNDRAISERS

     Actual field:
     deadline = "YYYY-MM-DD"

     approved
     → deadline
     → wait 2 days
     → archived
  ========================================================= */

async function processFundraisers(
  now: Timestamp
) {
  const snapshot =
      await db
        .collection(
          "fundraisers"
        )
        .where(
          "status",
          "==",
          "approved"
        )
        .get();


  for (
    const fundraiserDocument
    of snapshot.docs
  ) {
    const data =
        fundraiserDocument.data();


    const deadlineTime =
        dateStringToMillis(
          data.deadline
        );


    if (
      !deadlineTime
    ) {
      continue;
    }


    if (
      now.toMillis() <
        deadlineTime +
        TWO_DAYS_MS
    ) {
      continue;
    }


    await archiveDocument({

      collectionName:
          "fundraisers",

      documentId:
          fundraiserDocument.id,

      data,

      previousStatus:
          "approved",

      reason:
          "fundraiser_expired",

    });
  }
}


/* =========================================================
     ARCHIVE DOCUMENT
  ========================================================= */

async function archiveDocument(
  {
    collectionName,
    documentId,
    data,
    previousStatus,
    reason,
  }: {
      collectionName: string;
      documentId: string;
      data: FirebaseFirestore.DocumentData;
      previousStatus: string;
      reason: string;
    }
) {
  const reference =
      db
        .collection(
          collectionName
        )
        .doc(
          documentId
        );


  /*
      Keep archived content for
      90 days.

      Later Firestore TTL can use
      this field.
    */

  const deleteAt =
      Timestamp.fromMillis(
        Date.now() +
        NINETY_DAYS_MS
      );


  const batch =
      db.batch();


  batch.update(
    reference,
    {

      status:
          "archived",

      archivedAt:
          FieldValue.serverTimestamp(),

      archivedBy:
          "system",

      archiveReason:
          reason,

      deleteAt,

      updatedAt:
          FieldValue.serverTimestamp(),

    }
  );

  createArchiveRecord({

    batch,

    collectionName,

    itemId:
        documentId,

    data,

    previousStatus,

    archiveReason:
        reason,

    archivedBy:
        "system",

    deleteAt,

  });

  /* =========================
       AUDIT LOG
    ========================= */

  const auditReference =
      db
        .collection(
          "auditLogs"
        )
        .doc();


  batch.set(
    auditReference,
    {

      action:
          "content_auto_archived",

      itemId:
          documentId,

      collectionName,

      previousStatus,

      newStatus:
          "archived",

      reason,

      performedBy:
          "system",

      performedByRole:
          "system",

      deleteAt,

      createdAt:
          FieldValue.serverTimestamp(),

    }
  );


  /* =========================
       OWNER NOTIFICATION
    ========================= */

  const ownerId =
      getOwnerId(
        data
      );


  if (
    ownerId
  ) {
    const notificationReference =
        db
          .collection(
            "notifications"
          )
          .doc();


    batch.set(
      notificationReference,
      {

        userId:
            ownerId,

        type:
            "content_auto_archived",

        title:
            "Content archived",

        message:
            getArchiveMessage(
              collectionName
            ),

        itemId:
            documentId,

        collectionName,

        read:
            false,

        createdAt:
            FieldValue.serverTimestamp(),

      }
    );
  }


  await batch.commit();
}


/* =========================================================
     TIMESTAMP → MILLISECONDS
  ========================================================= */

function timestampToMillis(
  value: unknown
): number {
  if (
    !value
  ) {
    return 0;
  }


  if (
    value instanceof Timestamp
  ) {
    return value.toMillis();
  }


  if (
    typeof (
        value as {
          toMillis?: () => number
        }
    ).toMillis ===
      "function"
  ) {
    return (
        value as {
          toMillis: () => number
        }
    ).toMillis();
  }


  return 0;
}


/* =========================================================
     YYYY-MM-DD → MILLISECONDS
  ========================================================= */

function dateStringToMillis(
  value: unknown
): number {
  if (
    typeof value !==
      "string"
  ) {
    return 0;
  }


  const cleanValue =
      value.trim();


  if (
    !cleanValue
  ) {
    return 0;
  }


  /*
      Treat closing date as the
      end of that calendar day.

      Example:
      2026-08-21
      becomes
      2026-08-21 23:59:59
    */

  const date =
      new Date(
        `${cleanValue}T23:59:59`
      );


  const milliseconds =
      date.getTime();


  if (
    Number.isNaN(
      milliseconds
    )
  ) {
    return 0;
  }


  return milliseconds;
}


/* =========================================================
     OWNER
  ========================================================= */

function getOwnerId(
  data: FirebaseFirestore.DocumentData
): string {
  const ownerId =
      data.userId ||
      data.ownerId ||
      data.createdBy ||
      data.creatorId ||
      data.organiserId ||
      "";


  return typeof ownerId ===
      "string" ?
    ownerId :
    "";
}


/* =========================================================
     NOTIFICATION MESSAGE
  ========================================================= */

function getArchiveMessage(
  collectionName: string
): string {
  switch (
    collectionName
  ) {
  case "events":

    return (
      "Your event has been automatically archived because it ended more than 2 days ago."
    );


  case "opportunities":

    return (
      "Your opportunity has been automatically archived because its closing date passed more than 2 days ago."
    );


  case "fundraisers":

    return (
      "Your fundraiser has been automatically archived because its deadline passed more than 2 days ago."
    );


  case "marketplaceListings":

    return (
      "Your Marketplace listing has been archived because it expired and was not renewed within 7 days."
    );


  default:

    return (
      "Your content has been automatically archived."
    );
  }
}
