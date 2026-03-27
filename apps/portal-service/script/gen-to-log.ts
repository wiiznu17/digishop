import { generateKeyPairSync } from 'crypto'

function genPair(name: string) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  const b64 = (pem: string) => Buffer.from(pem, 'utf8').toString('base64')

  console.log(`\n=== ${name} (PEM) ===`)
  console.log(privateKey)
  console.log(publicKey)

  console.log(`\n=== ${name} (.env as *_KEY with \\n) ===`)
  console.log(
    `${`JWT_${name}_PRIVATE_KEY`}="${privateKey.replace(/\n/g, '\\n')}"`
  )
  console.log(
    `${`JWT_${name}_PUBLIC_KEY`}="${publicKey.replace(/\n/g, '\\n')}"`
  )

  console.log(`\n=== ${name} (.env as *_KEY_B64) ===`)
  console.log(`${`JWT_${name}_PRIVATE_KEY_B64`}="${b64(privateKey)}"`)
  console.log(`${`JWT_${name}_PUBLIC_KEY_B64`}="${b64(publicKey)}"`)
}

// สร้าง 2 ชุด: ACCESS และ REFRESH
genPair('ACCESS')
genPair('REFRESH')
