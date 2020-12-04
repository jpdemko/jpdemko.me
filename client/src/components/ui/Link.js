import styled, { css } from "styled-components/macro"

const Anchor = styled.a`
	text-decoration: none;
	${({ theme }) => css`
		color: ${theme.highlight};
		transition: all 0.175s;
		background-image: linear-gradient(${theme.highlight}, ${theme.highlight});
		background-position: 0% 100%;
		background-repeat: no-repeat;
		background-size: 100% 2px;
		&:hover {
			color: ${theme.primaryContrast};
			background-size: 100% 100%;
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
