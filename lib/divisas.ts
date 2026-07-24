import { supabase } from './supabase'

export interface ConfigDivisas {
  divisa_principal: string
  simbolo_principal: string
  divisa_secundaria: string
  simbolo_secundaria: string
  tasa_cambio: number
  mostrar_como: 'PRINCIPAL' | 'SECUNDARIA' | 'AMBAS'
}

export const DEFAULT_DIVISAS: ConfigDivisas = {
  divisa_principal: 'USD',
  simbolo_principal: '$',
  divisa_secundaria: 'VED',
  simbolo_secundaria: 'Bs.',
  tasa_cambio: 100,
  mostrar_como: 'AMBAS',
}

export function fmtPrincipal(monto: number, config: ConfigDivisas = DEFAULT_DIVISAS): string {
  return `${config.simbolo_principal} ${montoLocale(monto)}`
}

export function fmtSecundaria(monto: number, config: ConfigDivisas = DEFAULT_DIVISAS): string {
  const convertido = monto * config.tasa_cambio
  return `${config.simbolo_secundaria} ${montoLocale(convertido)}`
}

export function fmtMonto(monto: number, config: ConfigDivisas = DEFAULT_DIVISAS): string {
  if (config.mostrar_como === 'PRINCIPAL') return fmtPrincipal(monto, config)
  if (config.mostrar_como === 'SECUNDARIA') return fmtSecundaria(monto, config)
  return `${fmtPrincipal(monto, config)} / ${fmtSecundaria(monto, config)}`
}

export function fmtTasa(config: ConfigDivisas = DEFAULT_DIVISAS): string {
  return `1 ${config.divisa_principal} = ${montoLocale(config.tasa_cambio)} ${config.divisa_secundaria}`
}

function montoLocale(valor: number): string {
  return valor.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function getConfigDivisas(): Promise<ConfigDivisas> {
  try {
    const { data, error } = await supabase.from('config_divisas').select('*').single()
    if (error || !data) return DEFAULT_DIVISAS
    return {
      divisa_principal: data.divisa_principal,
      simbolo_principal: data.simbolo_principal,
      divisa_secundaria: data.divisa_secundaria,
      simbolo_secundaria: data.simbolo_secundaria,
      tasa_cambio: Number(data.tasa_cambio),
      mostrar_como: data.mostrar_como,
    }
  } catch {
    return DEFAULT_DIVISAS
  }
}
