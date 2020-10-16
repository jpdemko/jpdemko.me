import * as React from "react"
import styled, { css } from "styled-components/macro"
import { Transition } from "react-transition-group"

import Backdrop from "./Backdrop"

/* --------------------------------- STYLES --------------------------------- */

const StyledSVG = styled.svg`
	animation: rotate 1s linear infinite;
	padding: 1em;
	min-width: 50px;
	max-width: 50%;
	min-height: 50px;
	max-height: 50%;
	${({ theme }) => css`
		& .path {
			stroke: ${theme.contrast};
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
	z-index: 270000;
`

/* -------------------------------- COMPONENT ------------------------------- */

function Loading({ isLoading = false, animDuration = 0.4, ...props }) {
	return (
		<>
			<Backdrop isShown={isLoading} animDuration={animDuration} />
			<Transition timeout={animDuration * 1000} in={isLoading} unmountOnExit>
				<Center>
					<StyledSVG {...props} viewBox="0 0 50 50">
						<circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="2" />
					</StyledSVG>
				</Center>
			</Transition>
		</>
	)
}

export default Loading
