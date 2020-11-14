import styled, { css } from "styled-components/macro"

const Anchor = styled.a`
	text-decoration: none;
	${({ theme, animDuration = 0.175 }) => css`
		color: ${theme.highlight};
		transition: all ${animDuration}s;
		box-shadow: 0 0.05em 0 0 ${theme.highlight}, 0 -0.05em 0 0 ${theme.highlight} inset;
		&:hover {
			color: ${theme.primaryContrast};
			box-shadow: 0 0.05em 0 0 ${theme.highlight}, 0 calc(-0.05em + -1.1em) 0 0 ${theme.highlight} inset;
		}
	`}
`

function Link({ children, openNewTab = true, trustedLink = false, ...props }) {
	const attrs = {
		...(openNewTab && { target: "_blank" }),
		...(!trustedLink && { rel: "noopener noreferrer" }),
	}

	return (
		<Anchor {...props} {...attrs}>
			{children}
		</Anchor>
	)
}

export default Link
