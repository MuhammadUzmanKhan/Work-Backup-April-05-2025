
const ErrorComponent = ({text, touched} : 
  {
    text: string | undefined,
    touched: boolean | undefined
  }
) => {
  return (
  <>
     {touched && <div style={{color: '#dc3545', fontSize:'0.8rem'}}>
      {text}
      </div>}
  </>
  )
}

export default ErrorComponent