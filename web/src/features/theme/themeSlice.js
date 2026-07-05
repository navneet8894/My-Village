import { createSlice } from '@reduxjs/toolkit';

function applyDarkClass(dark) {
  if (dark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

const saved = localStorage.getItem('theme');
const initialDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
applyDarkClass(initialDark);

const slice = createSlice({
  name: 'theme',
  initialState: { dark: initialDark },
  reducers: {
    toggleTheme(state) {
      state.dark = !state.dark;
      localStorage.setItem('theme', state.dark ? 'dark' : 'light');
      applyDarkClass(state.dark);
    },
    setTheme(state, action) {
      state.dark = action.payload;
      localStorage.setItem('theme', state.dark ? 'dark' : 'light');
      applyDarkClass(state.dark);
    },
  },
});

export const { toggleTheme, setTheme } = slice.actions;
export default slice.reducer;
