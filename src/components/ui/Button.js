import React from 'react'
import styled, { css } from 'styled-components/macro'
import { transparentize, mix } from 'polished'

import { propStartsWith, safeTranslate } from '../../shared/helpers'
import { sharedCSS } from '../../shared/variables'

const ButtonBase = styled.button.attrs(({ disabled, size, variant, color, SVG }) => {
  let sizeModifier = 1
  if (size) {
    if (propStartsWith(size, 's')) sizeModifier = 0.75
    else if (propStartsWith(size, 'l')) sizeModifier = 1.25
  }

  let extraProps = {
    buttonCSS: {
      fontSize: `calc(1em * ${sizeModifier})`,
      sidePadding: `calc(0.6em * ${sizeModifier})`,
      verticalPadding: `calc(0.25em * ${sizeModifier})`,
      ...sharedCSS.themes.mono,
    },
    disabled: disabled || false,
  }

  // Default style changes based on incoming 'color' (default/blue/red) prop and/or
  // 'variant' (default/outlined/fancy) prop.
  if (propStartsWith(variant, 'f') || propStartsWith(color, 'b')) {
    extraProps.buttonCSS = {
      ...extraProps.buttonCSS,
      ...sharedCSS.themes.blue,
    }
  }
  if (propStartsWith(color, 'r')) {
    extraProps.buttonCSS = {
      ...extraProps.buttonCSS,
      ...sharedCSS.themes.red,
    }
  }

  // Default style changes based on incoming 'SVG' and/or 'adjustSVG' prop.
  if (SVG) {
    extraProps.buttonCSS = {
      ...extraProps.buttonCSS,
      sidePadding: `calc(${extraProps.buttonCSS.sidePadding} / 2)`,
      verticalPadding: `calc(${extraProps.buttonCSS.verticalPadding} / 2)`,
    }
  }

  return extraProps
})`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: none;
  background: none;
  text-transform: uppercase;
  transition: opacity 0.2s, background 0.15s, box-shadow 0.15s, outline 0.1s;
  font-weight: 500;
  outline: none;
  ${({ buttonCSS, disabled, adjustSVG }) => css`
    font-size: ${buttonCSS.fontSize};
    padding: ${buttonCSS.verticalPadding} ${buttonCSS.sidePadding};
    color: ${buttonCSS.mainColor};
    opacity: ${disabled ? 0.33 : 1};
    cursor: ${disabled ? 'default' : 'pointer'};
    svg {
      ${adjustSVG && `transform: ${safeTranslate(adjustSVG)};`}
    }
  `}
`

const Button = styled(ButtonBase)`
  ${({ buttonCSS, focused }) => css`
    background: ${focused ? transparentize('.8', buttonCSS.mainColor) : 'none'};
    &:focus {
      background: ${transparentize('.9', buttonCSS.mainColor)};
    }
    &:hover {
      background: ${transparentize('.7', buttonCSS.mainColor)};
    }
    &:active {
      background: ${transparentize('.6', buttonCSS.mainColor)};
      outline: 2px solid ${transparentize('.25', buttonCSS.mainColor)};
    }
  `}
`

const OutlinedButton = styled(Button)`
  ${({ buttonCSS }) => css`
    border: 1px solid ${buttonCSS.mainColor};
    &:active {
      outline: 1px solid ${transparentize('.25', buttonCSS.mainColor)};
    }
  `}
`

const FancyButton = styled(ButtonBase)`
  color: white;
  ${({ buttonCSS, focused }) => {
    const mixedColors = mix('.6', buttonCSS.mainColor, buttonCSS.altColor)
    return css`
			${buttonCSS.gradient}
			box-shadow: 0 1px 6px 1px ${transparentize('.4', mixedColors)};
			outline: ${focused ? `1px solid ${buttonCSS.altColor}` : 'none'};
			&:focus {
				box-shadow: 0 1px 13px 0px ${transparentize('.7', mixedColors)};
				outline: 1px solid ${buttonCSS.altColor};
			}
			&:hover {
				opacity: 0.8;
			}
			&:active {
				outline: 2px solid ${buttonCSS.altColor};
				opacity: 1;
			}
		`
  }}
`

export default function(props) {
  let ButtonVariant = Button
  if (props.variant) {
    if (propStartsWith(props.variant, 'o')) ButtonVariant = OutlinedButton
    else if (propStartsWith(props.variant, 'f')) ButtonVariant = FancyButton
  }

  return (
    <ButtonVariant {...props}>
      {props.SVG && <props.SVG />}
      {props.children && <span>{props.children}</span>}
    </ButtonVariant>
  )
}
