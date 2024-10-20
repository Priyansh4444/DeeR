"use client";

import { useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";

const dashAnimation = keyframes`
  to {
    stroke-dashoffset: 200;
  }
`;

const LoadingContainer = styled.div`
  display: grid;
  place-items: center;
  background: #121212;
  height: 100vh;
  width: 100vw;
  position: fixed;
  z-index: 10;
  transform-origin: center;
  transition: background 2s;
`;

const StyledPath = styled.path`
  stroke-dasharray: 15;
  stroke: #000000;
  animation: ${dashAnimation} 5s linear infinite;
  animation-delay: -1s;
  transition: stroke 0.2s;
`;

const LoadingAnimation = ({
  onLoadingComplete,
}: {
  onLoadingComplete: () => void;
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pathRef.current) {
        pathRef.current.style.strokeDasharray = "0";
        pathRef.current.style.stroke = "transparent";
      }
      if (containerRef.current) {
        containerRef.current.style.background = "transparent";
      }
      onLoadingComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <LoadingContainer ref={containerRef}>
      <svg
        width="29"
        height="24"
        viewBox="0 0 29 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <StyledPath ref={pathRef} d="M14.3564 0L28.2128 24H0.5L14.3564 0Z" />
        <defs>
          <linearGradient
            id="paint0_linear_742_347"
            x1="3.35641"
            y1="18"
            x2="25.8564"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E5B1EE" />
            <stop offset="0.517791" stopColor="#D9D9D9" />
            <stop offset="0.9999" stopColor="#57859C" />
          </linearGradient>
        </defs>
      </svg>
    </LoadingContainer>
  );
};

export default LoadingAnimation;
