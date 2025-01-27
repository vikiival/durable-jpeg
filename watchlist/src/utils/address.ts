import { decodeAddress, encodeAddress } from '@polkadot/util-crypto'

export function toSS58(address: string) {
  return encodeAddress(decodeAddress(address), 42)
}
