// /logout: sign out from any screen by typing the address.
import { NextResponse } from 'next/server'
import { userRepo } from '@/lib/data'

export async function GET(req: Request) {
  await (await userRepo()).signOut()
  return NextResponse.redirect(new URL('/login', req.url))
}
