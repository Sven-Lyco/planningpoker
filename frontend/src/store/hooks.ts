import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

/**
 * Typed `useDispatch` hook – use instead of plain `useDispatch`.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed `useSelector` hook – use instead of plain `useSelector`.
 */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
