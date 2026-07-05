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
        '4xsmall': variables.space4xsmall,
        '3xsmall': variables.space3xsmall,
        '2xsmall': variables.space2xsmall,
        xsmall: variables.spaceXsmall,
        medium: variables.spaceMedium,
        large: variables.spaceLarge,
        xlarge: variables.spaceXlarge,
        '2xlarge': variables.space2xlarge,
        '3xlarge': variables.space3xlarge,
        '4xlarge': variables.space4xlarge,
        '5xlarge': variables.space5xlarge,
        '6xlarge': variables.space6xlarge
      }
    case 'breakpoint':
      return {
        '2xlarge': variables.breakpoint2xlarge,
        xlarge: variables.breakpointXlarge,
        large: variables.breakpointLarge,
        medium: variables.breakpointMedium,
        small: variables.breakpointSmall
      }
    case 'container':
      return {
        '2xlarge': variables.container2xlarge,
        xlarge: variables.containerXlarge,
        large: variables.containerLarge,
        medium: variables.containerMedium,
        small: variables.containerSmall
      }
    case 'grid':
      return {
        gutter: variables.gridGutter
      }
    case 'modal':
      return {
        small: variables.modalSmall,
        medium: variables.modalMedium,
        large: variables.modalLarge,
        xlarge: variables.modalXlarge
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
