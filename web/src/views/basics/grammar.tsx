import React from "react";
import { rangeFromTo } from "../../utilities/range";

const ConjunctionClauseView = (conjunction: string) => ({items}: {items: (JSX.Element | string)[]}): JSX.Element => {
  if (items.length == 0) return (<></>);
  // At least one item.  Make it start of clause.
  if (items.length == 1) return (<>{items[0]}</>);
  return (
    <>{ items.map( (item, index) => (
      <span key={index}>{
        index == 0 ? "" :
        index < items.length - 1 ? ", " :
        items.length > 2 ? `, ${conjunction} ` :
        ` ${conjunction} `
      }{item}</span>
    ))}</>
  )
}

export const AndClause = ConjunctionClauseView("and");
export const OrClause = ConjunctionClauseView("or");

export const firstThroughTentyFourthEn = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth",
"tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth",
"eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth"] as const;
export const zerothThroughTentyFourthEn = ["zeroth", ...firstThroughTentyFourthEn] as const;

export const oneThroughTwentyFourEn = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
  "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four"] as const;

export const zeroThroughTwentyFourEn = ["zero", ...oneThroughTwentyFourEn] as const;

export const oneThrough24En = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", ...rangeFromTo(11, 24).map( n => `${n}`)] as const;

export const zeroThrough24En = ["zero", ...oneThrough24En] as const;
