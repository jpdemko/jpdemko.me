import { getLuminance } from "polished"
import styled, { css } from "styled-components/macro"

const Root = styled.div`
	text-align: start;
	font-weight: bold;
	padding: 0.2em 0.3em;
	display: flex;
	align-items: center;
	${({ theme, hue }) => {
		try {
			const bg = `hsl(${hue}, 85%, 50%)`
			const color = theme.readableColor(bg)
			const filter = getLuminance(color) > 0.5 ? "drop-shadow(0 0 1px rgba(0, 0, 0, 0.65))" : "none"
			return css`
				background: ${bg};
				span {
					color: ${color};
					filter: ${filter};
				}
			`
		} catch (error) {
			console.log(`<TempHue /> error`)
			return css`
				background: none;
			`
		}
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
			<span>{children}</span>
		</Root>
	)
}

export default TempHue
