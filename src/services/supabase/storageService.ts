
/**
 * This file exports all storage service functionality from individual modules
 * for better maintainability.
 */

import { listAvailableBuckets, countFilesInBucket } from "./storage/bucketOperations";
import { fetchBillsFromStorage, fetchBillByIdFromStorage } from "./storage/billStorageService";

export {
  listAvailableBuckets,
  countFilesInBucket,
  fetchBillsFromStorage,
  fetchBillByIdFromStorage
};
