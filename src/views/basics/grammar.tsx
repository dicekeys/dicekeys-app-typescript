import React from "react";

const ConjunctionClauseView = (conjunction: string) => ({items}: {items: JSX.Element[]}): JSX.Element => {
  if (items.length == 0) return (<></>);
  // At least one item.  Make it start of clause.
  if (items.length == 1) return items[0];
  return (
    <>{ items.map( (item, index) => (
      <span key={index}>{
        index == 0 ? "" :
        index < items.length - 1 ? ", " :
        ` ${conjunction} `
      }{item}</span>
    ))}</>
  )
}

export const AndClause = ConjunctionClauseView("and");
export const OrClause = ConjunctionClauseView("or");
