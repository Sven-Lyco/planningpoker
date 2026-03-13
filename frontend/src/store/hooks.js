import { useDispatch, useSelector } from "react-redux";
/**
 * Typed `useDispatch` hook – use instead of plain `useDispatch`.
 */
export const useAppDispatch = () => useDispatch();
/**
 * Typed `useSelector` hook – use instead of plain `useSelector`.
 */
export const useAppSelector = (selector) => useSelector(selector);
