export type PrototypeSweetBookEstimateStatus =
  | "ready_for_order"
  | "blocked_insufficient_credit";

export type PrototypeSweetBookContentInsertion = {
  attempt: number;
  result: string;
  breakBefore: string;
  pageNum: number;
  pageSide: string;
  pageCount: number;
};

export type PrototypeSweetBookEstimate = {
  status: PrototypeSweetBookEstimateStatus;
  bookUid: string;
  uploadedPhotoFileName: string;
  pageCount: number;
  contentInsertions: PrototypeSweetBookContentInsertion[];
  estimate: {
    items?: Array<{
      bookUid: string;
      bookSpecUid?: string | null;
      pageCount?: number | null;
      quantity: number;
      unitPrice?: number | null;
      itemAmount?: number | null;
      packagingFee?: number | null;
    }>;
    totalAmount: number;
    paidCreditAmount?: number | null;
    creditBalance?: number | null;
    creditSufficient?: boolean | null;
    currency: string;
  };
};

export type PrototypeSweetBookSubmitResult = {
  status: "submitted";
  bookUid: string;
  uploadedPhotoFileName: string;
  pageCount: number;
  contentInsertions: PrototypeSweetBookContentInsertion[];
  estimate: PrototypeSweetBookEstimate["estimate"];
  order: {
    orderUid: string;
    orderStatus: number | string;
    orderStatusDisplay?: string | null;
    paidCreditAmount?: number | null;
    creditBalanceAfter?: number | null;
  };
};
