import variables from '../scss/_tokens.module.scss'

export function sassVars(str: string): Record<string, string | undefined> {
  switch (str) {
    case 'color':
      return {
        primary: variables.colorPrimary,
        secondary: variables.colorSecondary,
        neutral: variables.colorNeutral,
        danger: variables.colorDanger,
        success: variables.colorSuccess,
        warning: variables.colorWarning,
        info: variables.colorInfo
      }
    case 'space':
      return {
        '4xs': variables.space4xsmall,
        '3xs': variables.space3xsmall,
        '2xs': variables.space2xsmall,
        xs: variables.spaceXsmall,
        md: variables.spaceMedium,
        lg: variables.spaceLarge,
        xl: variables.spaceXlarge,
        '2xl': variables.space2xlarge,
        '3xl': variables.space3xlarge,
        '4xl': variables.space4xlarge,
        '5xl': variables.space5xlarge,
        '6xl': variables.space6xlarge
      }
    case 'breakpoint':
      return {
        '2xl': variables.breakpoint2xlarge,
        xl: variables.breakpointXlarge,
        lg: variables.breakpointLarge,
        md: variables.breakpointMedium,
        sm: variables.breakpointSmall
      }
    case 'container':
      return {
        '2xl': variables.container2xlarge,
        xl: variables.containerXlarge,
        lg: variables.containerLarge,
        md: variables.containerMedium,
        sm: variables.containerSmall
      }
    case 'grid':
      return {
        gutter: variables.gridGutter
      }
    case 'modal':
      return {
        sm: variables.modalSmall,
        md: variables.modalMedium,
        lg: variables.modalLarge,
        xl: variables.modalXlarge
      }
    case 'setting':
      return {
        baseFontSize: variables.baseFontSize || '16'
      }
    default:
      return {}
  }
}

export function sassSpaceValue(str: string) {
  const vars = sassVars('space')
  const value = vars[str]
  if (value?.endsWith('px')) {
    return `<code>${value}</code>`
  } else {
    return `<code>${value}</code> (<code>${value ? parseFloat(value) * parseFloat(sassVars('setting')['baseFontSize'] || '16') + 'px' : 'NaN'}</code>)`
  }
}

export function sassBreakpointSize(str: string) {
  const value = sassVars('breakpoint')[str]
  if (value?.endsWith('px')) {
    return value
  } else {
    return value
      ? parseFloat(value) * parseFloat(sassVars('setting')['baseFontSize'] || '16') + 'px'
      : 'NaN'
  }
}

export function sassContainerSize(str: string) {
  const value = sassVars('container')[str]
  if (value?.endsWith('px')) {
    return value
  } else {
    return value
      ? parseFloat(value) * parseFloat(sassVars('setting')['baseFontSize'] || '16') + 'px'
      : 'NaN'
  }
}

export function sassModalSize(str: string) {
  const value = sassVars('modal')[str]
  if (value?.endsWith('px')) {
    return value
  } else {
    return value
      ? parseFloat(value) * parseFloat(sassVars('setting')['baseFontSize'] || '16') + 'px'
      : 'NaN'
  }
}
