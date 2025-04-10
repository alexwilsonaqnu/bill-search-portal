
/**
 * This file exports all storage service functionality from individual modules
 * for better maintainability.
 */

import { listAvailableBuckets, countFilesInBucket, listFilesInBucket } from "./storage/bucketOperations";
import { fetchBillsFromStorage, fetchBillByIdFromStorage } from "./storage/billStorageService";

export {
  listAvailableBuckets,
  countFilesInBucket,
  listFilesInBucket,
  fetchBillsFromStorage,
  fetchBillByIdFromStorage
};
