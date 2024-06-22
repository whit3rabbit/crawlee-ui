import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CrawlResult {
  url: string;
  pageTitle: string;
  [key: string]: any; // Allow for additional properties
}

interface CrawlState {
  results: CrawlResult[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CrawlState = {
  results: [],
  isLoading: false,
  error: null,
};

const crawlSlice = createSlice({
  name: 'crawl',
  initialState,
  reducers: {
    startCrawl: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    crawlSuccess: (state, action: PayloadAction<CrawlResult[]>) => {
      state.isLoading = false;
      state.results = action.payload;
    },
    crawlFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const { startCrawl, crawlSuccess, crawlFailure } = crawlSlice.actions;
export default crawlSlice.reducer;