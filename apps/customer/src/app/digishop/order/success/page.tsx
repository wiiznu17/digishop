'use client'

import Link from "next/link"

export default function Success() {
    return (
        <div className="flex justify-center items-center p-4">
            <div>
                <div className="text-4xl m-3 p-3">
                    Order is successful
                </div>
                <div className="flex">
                    <Link href='/digishop/order/status' className="p-3 bg-blue-500 cursor-pointer text-white">see order status</Link>
                    <Link href='/digishop' className="mx-6 p-4 bg-fuchsia-500 cursor-pointer">back first page</Link>
                </div>
            </div>
        </div>
    )
}