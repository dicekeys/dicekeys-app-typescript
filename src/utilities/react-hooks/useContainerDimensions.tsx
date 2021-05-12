import React from "react";

// https://stackoverflow.com/questions/43817118/how-to-get-the-width-of-a-react-element
export const useContainerDimensions = (myRef: React.RefObject<any>) => {
  const getDimensions = () => ({
    width: myRef.current.offsetWidth,
    height: myRef.current.offsetHeight
  })

  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const handleResize = () => {
      setDimensions(getDimensions())
    }

    if (myRef.current) {
      setDimensions(getDimensions())
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [myRef])

  return dimensions;
};
