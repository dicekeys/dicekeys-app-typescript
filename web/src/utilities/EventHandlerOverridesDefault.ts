/**
 * Wrap a DOM event handler to automatically call the event's preventDefault method
 * @param handler Any handler that takes a single parameter, which is an event object, with a preventDefault function.
 * @returns a function that calls preventDefault() on the event before calling the handler.
 */
export const EventHandlerOverridesDefault = <R, EVENT extends {preventDefault: ()=> void}>(handler: (e: EVENT)=>R): (e: EVENT)=>R =>
  (e: EVENT): R => {
  e.preventDefault();
  return handler(e);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export const EventHandlerOverridesDefault = <FN extends (event: {preventDefault: ()=> void}) => any>(handler: FN) => (e: Parameters<FN>[0]): ReturnType<FN> => {
//   e.preventDefault();
//   return handler(e);
// };
