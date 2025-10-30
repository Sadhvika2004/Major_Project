import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768) {
	const [isMobile, setIsMobile] = useState<boolean>(false)

	useEffect(() => {
		function onResize() {
			setIsMobile(window.innerWidth < breakpoint)
		}

		onResize()
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [breakpoint])

	return isMobile
}

export default useIsMobile
