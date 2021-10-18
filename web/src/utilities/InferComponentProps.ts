// Import types only.
// From https://stackoverflow.com/questions/64054467/infer-prop-interface-from-styled-component

import { ComponentPropsWithoutRef, JSXElementConstructor } from "react"
import {
  AnyStyledComponent,
  StyledComponentInnerComponent,
  StyledComponentInnerOtherProps,
  StyledComponentInnerAttrs
} from "styled-components"

export type InferComponentProps<T> =
  T extends AnyStyledComponent ?
    ( 
        ComponentPropsWithoutRef<StyledComponentInnerComponent<T>> &
        Omit<StyledComponentInnerOtherProps<T>, StyledComponentInnerAttrs<T>>
    )
    :
    T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any> ?
      ComponentPropsWithoutRef<T> :
      never;