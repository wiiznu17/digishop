export default function NotFound({ props }: { props: string }) {
  return (
    <div className="">
      <div className="flex justify-center items-center p-4">
        Sorry we are not found {props}{' '}
      </div>
    </div>
  )
}
