import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";

import {
  db,
} from "./firebase-admin";


export function getArchiveRecordId(
  collectionName: string,
  itemId: string
): string {
  return (
    `${collectionName}__${itemId}`
  );
}


export function getArchiveTitle(
  data: FirebaseFirestore.DocumentData
): string {
  return (
    data.title ||
      data.name ||
      data.eventName ||
      data.opportunityTitle ||
      data.fundraiserTitle ||
      "Untitled Content"
  );
}


export function getArchiveOwnerId(
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


export function getArchiveOwnerName(
  data: FirebaseFirestore.DocumentData
): string {
  return (
    data.userName ||
      data.ownerName ||
      data.createdByName ||
      data.organiserName ||
      "Unknown"
  );
}


export function getContentType(
  collectionName: string
): string {
  const types:
    Record<
      string,
      string
    > = {

      marketplaceListings:
        "marketplace",

      events:
        "event",

      opportunities:
        "opportunity",

      fundraisers:
        "fundraiser",

    };


  return (
    types[
      collectionName
    ] ||
      "content"
  );
}


export function createArchiveRecord(
  {
    batch,
    collectionName,
    itemId,
    data,
    previousStatus,
    archiveReason,
    archivedBy,
    deleteAt,
  }: {
      batch:
        FirebaseFirestore.WriteBatch;

      collectionName:
        string;

      itemId:
        string;

      data:
        FirebaseFirestore.DocumentData;

      previousStatus:
        string;

      archiveReason:
        string;

      archivedBy:
        string;

      deleteAt:
        Timestamp;
    }
): void {
  const recordId =
      getArchiveRecordId(
        collectionName,
        itemId
      );


  const recordReference =
      db
        .collection(
          "archiveRecords"
        )
        .doc(
          recordId
        );


  batch.set(
    recordReference,
    {

      itemId,

      collectionName,

      contentType:
          getContentType(
            collectionName
          ),

      title:
          getArchiveTitle(
            data
          ),

      ownerId:
          getArchiveOwnerId(
            data
          ),

      ownerName:
          getArchiveOwnerName(
            data
          ),

      previousStatus,

      archiveReason,

      archivedBy,

      archivedAt:
          FieldValue.serverTimestamp(),

      deleteAt,

      createdAt:
          FieldValue.serverTimestamp(),

    },
    {
      merge:
          true,
    }
  );
}
