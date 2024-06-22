import { configureStore } from '@reduxjs/toolkit';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CrawlState {
  results: any[];
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
    crawlSuccess: (state, action: PayloadAction<any[]>) => {
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

export const store = configureStore({
  reducer: {
    crawl: crawlSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;