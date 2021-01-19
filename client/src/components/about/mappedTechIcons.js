import styled from "styled-components/macro"

import { ReactComponent as SvgHTML } from "../../shared/assets/brands-icons/html.svg"
import { ReactComponent as SvgCSS } from "../../shared/assets/brands-icons/css.svg"
import { ReactComponent as SvgJavaScript } from "../../shared/assets/brands-icons/javascript.svg"
import { ReactComponent as SvgReact } from "../../shared/assets/brands-icons/react.svg"
import { ReactComponent as SvgNode } from "../../shared/assets/brands-icons/node.svg"
import { ReactComponent as SvgPostgreSQL } from "../../shared/assets/brands-icons/postgresql.svg"

const HTML = styled(SvgHTML)`
	color: #f16524; // f16524 OR e54c21
`

const CSS = styled(SvgCSS)`
	color: #2965f1; // 2965f1 OR 264de4
`

const JavaScript = styled(SvgJavaScript)`
	color: #f0db4f; // f0db4f OR fdd83c
`

const React = styled(SvgReact)`
	color: #00d8ff; // 00d8ff OR 57d3f5
`

const Node = styled(SvgNode)`
	color: #689f63; // 689f63 OR 6bbf47
`

const PostgreSQL = styled(SvgPostgreSQL)``

const TechIcons = {
	HTML,
	CSS,
	JavaScript,
	React,
	Node,
	PostgreSQL,
}

export default TechIcons
