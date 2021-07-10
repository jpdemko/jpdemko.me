import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

import Backdrop from "./Backdrop"
import { useMemo } from "react"
import { zOverlayGen } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const WrapSVG = styled.div`
	flex: 1 1 auto;
	display: inline-block;
	margin: 0.5em;
	max-width: 50vmin !important;
	max-height: 50vmin !important;
`

const StyledSVG = styled.svg`
	animation: rotate 1s linear infinite;
	${({ theme, animDuration, sideLength }) => css`
		min-width: ${sideLength};
		min-height: ${sideLength};
		transition: ${animDuration}s;
		& .path {
			stroke: ${theme.highlight};
			stroke-linecap: round;
			animation: dash 1.5s ease-in-out infinite;
		}
	`}
	@keyframes rotate {
		100% {
			transform: rotate(360deg);
		}
	}
	@keyframes dash {
		0% {
			stroke-dasharray: 1, 150;
			stroke-dashoffset: 0;
		}
		50% {
			stroke-dasharray: 90, 150;
			stroke-dashoffset: -35;
		}
		100% {
			stroke-dasharray: 90, 150;
			stroke-dashoffset: -124;
		}
	}
`

const Center = styled.div`
	position: absolute;
	height: 100%;
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	top: 0;
	left: 0;
	${({ zIndex }) => css`
		z-index: ${zIndex};
	`}
`

const svgStyleStates = {
	entering: { transform: "scale(1.2)", opacity: 1 },
	entered: { transform: "scale(1)", opacity: 1 },
	exiting: { transform: "scale(0)", opacity: 0 },
	exited: { transform: "scale(0)", opacity: 0 },
}

/* -------------------------------- COMPONENT ------------------------------- */

export function LoadingSVG({ animDuration = 0.4, sideLength = "24px", strokeWidth = 3, ...props }) {
	return (
		<WrapSVG>
			<StyledSVG {...props} sideLength={sideLength} viewBox="0 0 50 50" animDuration={animDuration}>
				<circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth={`${strokeWidth}`} />
			</StyledSVG>
		</WrapSVG>
	)
}

function LoadingScreen({ isLoading = false, animDuration = 0.4, ...props }) {
	const zIndex = useMemo(() => zOverlayGen.get(), [])

	return (
		<>
			<Backdrop isShown={isLoading} animDuration={animDuration} zIndex={zIndex} />
			<Transition timeout={animDuration * 1000} in={isLoading} mountOnEnter unmountOnExit>
				{(state) => (
					<Center zIndex={zIndex}>
						<LoadingSVG {...props} style={{ ...svgStyleStates[state] }} animDuration={animDuration} />
					</Center>
				)}
			</Transition>
		</>
	)
}

export default LoadingScreen
