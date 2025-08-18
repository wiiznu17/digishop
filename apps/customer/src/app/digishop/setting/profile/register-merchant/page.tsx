'use client'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useEffect, useState } from 'react';

export default function MyDialog() {
  const [isOpen, setIsOpen] = useState(false);
    useEffect(()=> {
        console.log('isOpen',isOpen)
    },[isOpen])
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Dialog</button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogPanel>
          <DialogTitle>My Dialog Title</DialogTitle>
          <p className='text-black'>This is the content of my dialog.</p>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </DialogPanel>
      </Dialog>
    </>
  );
}