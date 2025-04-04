
const TabsLabel = (
  {
    title,
    count,
    activeKey,
  }: {
    title: string,
    count?: number | null,
    activeKey?: string | null,
  }
) => {
  return (
    <div className="flex items-center gap-1 cursor-pointer">
      <p className={`${activeKey ? "text-tertiary" : 'text-[#000]'} text-[0.875rem]`}
      >
        {title}
      </p>
      {count !== null && <p className={`w-full h-[1.25rem] px-1 border ${activeKey ? "border-tertiary bg-tertiary text-white" : 'text-tertiary'} flex items-center justify-center text-[0.75rem]`}>
        {count || 0}
      </p>}
    </div >
  )
}

export default TabsLabel