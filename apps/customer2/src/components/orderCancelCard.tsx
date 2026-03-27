'use client'

import { SetStateAction, useEffect, useState } from 'react'
import InputField from '@/components/inputField'
import Button from './button'
import {
  CancelProp,
  CancelRefundProps,
  OrderDetail
} from '@/types/props/orderProp'
import CancelReasonMaster from '../master/cancelReason.json'
import RefundReasonMaster from '../master/refundReason.json'
import { cancelOrder } from '@/utils/requestUtils/requestOrderUtils'
import { OrderStatus } from '../../../../packages/db/src/types/enum'

interface CancelOrderProps {
  isShowCancel: CancelRefundProps
  email: string
  order: OrderDetail
  reason: string
  setReason: React.Dispatch<SetStateAction<string>>
  detail: string
  setDetail: React.Dispatch<SetStateAction<string>>
  setIsShowCancel: React.Dispatch<SetStateAction<CancelRefundProps>>
  handleOnCancel: () => void
}

export const CancelOrder = ({
  isShowCancel,
  order,
  email,
  reason,
  setReason,
  detail,
  setDetail,
  setIsShowCancel,
  handleOnCancel
}: CancelOrderProps) => {
  useEffect(() => {
    setCancelData({
      reason:
        CancelReasonMaster[reason as keyof typeof CancelReasonMaster].label,
      description: detail,
      contactEmail: email
    })
  }, [reason, detail, email])
  const [cancelData, setCancelData] = useState<CancelProp>()
  const handleOnConfirm = async () => {
    if (!reason) return
    setIsShowCancel({ ...isShowCancel, ['shown']: false })
    if (cancelData) {
      const updateCancelOrder = (await cancelOrder(order.id, cancelData)) as {
        data: string
      }
      if (updateCancelOrder.data) {
        window.location.reload()
      }
    }
  }

  const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value)
  }
  const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(e.target.value)
  }
  if (isShowCancel.shown)
    return (
      <div className="text-xl">
        <div className="border-b py-2 text-2xl font-medium mb-2 w-fit">
          Cancel
        </div>
        <div className=" m-1 pt-2 bg-white ">
          <div>I want to cancel this order because</div>
        </div>
        <div className="mb-3 px-4 rounded-md bg-white">
          <select
            name="reason"
            value={reason}
            onChange={handleSelectReson}
            className="border border-gray-500 p-3 mt-2 rounded-2xl "
          >
            <option id="1" value="CC01" className="mx-3 font-light">
              I don&apos;t want this the order.
            </option>
            <option id="2" value="CC02" className="mx-3 font-light">
              I ordered the wrong item.
            </option>
            <option id="3" value="CC03" className="mx-3 font-light">
              I need to change the shipping address.
            </option>
            <option id="4" value="CC04" className="mx-3 font-light">
              I found a store with a better price.
            </option>
            <option id="5" value="CC05" className="mx-3 font-light">
              I found a better product.
            </option>
            <option id="6" value="CC00" className="mx-3 font-light">
              other
            </option>
          </select>
          <div className={`my-3 rounded-md bg-white`}>
            <div className="">
              <InputField
                label="Detail"
                placeholder="cancel reason detail"
                name="detail"
                value={detail}
                className="h-auto"
                onChange={handleInputDetail}
                required={reason === 'CC00'}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6">
          <Button
            size="sm"
            onClick={handleOnCancel}
            className=" bg-red-500 text-white  mx-2"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleOnConfirm}
            className={`${reason === 'CC00' && detail.trim() === '' ? 'bg-gray-500 text-white' : 'bg-green-500 text-white'} `}
            disabled={reason === 'CC00' && reason.length === 0}
          >
            Confirm
          </Button>
        </div>
      </div>
    )
}
interface RefundOrderProps {
  isShowRefund: CancelRefundProps
  setIsShowRefund: React.Dispatch<SetStateAction<CancelRefundProps>>
  email: string
  order: OrderDetail
  reason: string
  setReason: React.Dispatch<SetStateAction<string>>
  detail: string
  setDetail: React.Dispatch<SetStateAction<string>>
  handleOnCancel: () => void
}
export const RefundOrder = ({
  isShowRefund,
  setIsShowRefund,
  order,
  email,
  reason,
  setReason,
  detail,
  setDetail,
  handleOnCancel
}: RefundOrderProps) => {
  const [refundData, setRefundData] = useState<CancelProp>()
  useEffect(() => {
    setRefundData({
      reason:
        RefundReasonMaster[reason as keyof typeof RefundReasonMaster].label,
      description: detail,
      contactEmail: email
    })
  }, [reason, detail, email])
  const handleOnConfirm = async () => {
    if (!reason) return
    setIsShowRefund({ ...isShowRefund, ['shown']: false })
    if (refundData) {
      const updateCancelOrder = (await cancelOrder(order.id, refundData)) as {
        data: { id: number; status: OrderStatus }
      }
      if (updateCancelOrder.data) {
        window.location.reload()
      }
    }
  }

  const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value)
  }
  const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(e.target.value)
  }
  if (isShowRefund.shown)
    return (
      <div className="text-xl">
        <div className="border-b py-2 text-2xl font-medium mb-2 w-fit">
          Refund
        </div>
        <div className=" m-1 pt-2 bg-white">
          <div>I want to refund this order</div>
        </div>
        <div className="mb-3 px-4 rounded-md bg-white">
          <div>because</div>
          <select
            name="reason"
            value={reason}
            onChange={handleSelectReson}
            className="border border-gray-500 p-3 mt-2 rounded-2xl "
          >
            <option id="1" value="RF01" className="mx-3 font-ligh">
              I don&apos;t want this the order.
            </option>
            <option id="2" value="RF02" className="mx-3 font-ligh">
              The item arrived damaged.
            </option>
            <option id="3" value="RF03" className="mx-3 font-ligh">
              The order is incomplete.
            </option>
            <option id="4" value="RF04" className="mx-3 font-ligh">
              I received the wrong item.
            </option>
            <option id="5" value="RF05" className="mx-3 font-ligh">
              The delivery was delayed.
            </option>
            <option id="6" value="RF06" className="mx-3 font-ligh">
              I am not satisfied with the product.
            </option>
            <option id="7" value="RF00" className="mx-3 font-ligh">
              other
            </option>
          </select>
          <div className={`my-3 rounded-md bg-white }`}>
            <div className="">
              <InputField
                label="Detail"
                placeholder="refund reason detail"
                name="detail"
                value={detail}
                onChange={handleInputDetail}
                required={reason === 'RF00'}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end ">
          <Button
            size="sm"
            onClick={handleOnCancel}
            className=" bg-red-500 text-white mx-2"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleOnConfirm}
            className={`${reason === 'RF00' && detail.trim() === '' ? 'bg-gray-500 text-white' : 'bg-green-500 text-white'}`}
            disabled={reason === 'RF00' && reason.length === 0}
          >
            Confirm
          </Button>
        </div>
      </div>
    )
}
