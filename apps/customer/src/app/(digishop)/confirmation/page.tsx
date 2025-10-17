"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ConfirmMail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // useEffect(() => {
  //   const verified = async() => {
  //       const res = await verifiedMail(token)
  //   } 
  //   verified()
  // }, []);
  return <div></div>;
}
