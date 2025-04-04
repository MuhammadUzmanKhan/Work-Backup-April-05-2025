import { Button, Result } from "antd"
import { useNavigate } from "react-router-dom"
import { apis, routes } from "../../services"
import { useEffect } from "react"


const Maintenance = () => {
  const navigation = useNavigate()

  const fetchData = async () => {
    const response = await apis.getMaintainceModeNotification()
    if (!response?.data?.maintenance?.maintenanceMode) {
      navigation(routes.dashboard)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div
      className="h-screen flex flex-col justify-center items-center"
    >
      <Result
        status="500"
        title="500"
        subTitle="We're taking a short break to improve your experience. We'll be back soon!"
        extra={<Button
          type="primary"
          onClick={() => navigation(routes.dashboard)}
          style={{ color: "white", backgroundColor: "#1A4895" }}
        >
          Back Home
        </Button>}
      />
    </div>
  )
}

export default Maintenance
