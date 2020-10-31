import styled, { css } from "styled-components/macro"

const Root = styled.div`
	text-align: start;
	font-weight: 500;
	${({ theme, hue }) => {
		const bg = `hsl(${hue}, 85%, 50%)`
		return css`
			background: ${bg};
			color: ${theme.readableColor(bg)};
		`
	}}
`

function TempHue({ temp, children, ...props }) {
	function getTempHue(temp) {
		if (!temp) return null
		temp = (temp - 32) * (5 / 9)
		if (temp > 40) temp = 40
		return Math.round((240 * (40 - temp + 1)) / 60)
	}

	return (
		<Root {...props} hue={getTempHue(temp)}>
			{children}
		</Root>
	)
}

export default TempHue
