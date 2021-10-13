import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

import Backdrop from "./Backdrop"
import { useMemo } from "react"
import { zOverlayGen } from "../../shared/shared"

/* --------------------------------- STYLES --------------------------------- */

const WrapSvg = styled.div`
	display: inline-block;
	padding: 0.25em;
`

const StyledLoadingSvg = styled.svg`
	animation: rotate 1s linear infinite;
	${({ theme, animDuration, sideLength }) => css`
		min-height: ${sideLength} !important;
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
	svg {
		height: 50%;
	}
	${({ zIndex }) => css`
		z-index: ${zIndex};
	`}
`

const svgStyleStates = {
	entering: { opacity: 1 },
	entered: { opacity: 1 },
	exiting: { opacity: 0 },
	exited: { opacity: 0 },
}

/* -------------------------------- COMPONENT ------------------------------- */

export function LoadingSvg({ animDuration = 0.4, sideLength = "24px", strokeWidth = 4, ...props }) {
	return (
		<StyledLoadingSvg {...props} sideLength={sideLength} viewBox="0 0 50 50" animDuration={animDuration}>
			<circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth={`${strokeWidth}`} />
		</StyledLoadingSvg>
	)
}

export function LoadingSvgInline(props) {
	return (
		<WrapSvg>
			<LoadingSvg {...props} />
		</WrapSvg>
	)
}

export function LoadingOverlay({ isLoading = false, animDuration = 0.4, backdrop = false, ...props }) {
	const zIndex = useMemo(() => zOverlayGen.get(), [])

	return (
		<>
			{backdrop && <Backdrop isShown={isLoading} animDuration={animDuration} zIndex={zIndex} />}
			<Transition timeout={animDuration * 1000} in={isLoading} mountOnEnter unmountOnExit>
				{(state) => (
					<Center zIndex={zIndex}>
						<LoadingSvg {...props} style={{ ...svgStyleStates[state] }} animDuration={animDuration} />
					</Center>
				)}
			</Transition>
		</>
	)
}
