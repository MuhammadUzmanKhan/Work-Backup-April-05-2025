import { images } from "../../../assets";
import Loader from "../../../components/loader";
import { Step3Props } from "../../../services/types/on-boarding";

const Step3 = ({ currentStep, values, handleFileUpload, setFieldValue, fileUploadingLoader }: Step3Props) => {
  return (
    <div className={`steps w-full step3 ${currentStep === 'logoUrl' ? "" : "hidden"}`}>
      <h3>Upload your Workspace Logo</h3>
      <p><strong>Your branding is important to us,</strong>  we want your workspace to feel like your own. Lets take a look.</p>
      <label className='mb-3 flex'>this is optional</label>
      <div className="infield upload">
        <input className="custom-input" type="file" placeholder="minimum 8 characters" name="file" accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, setFieldValue)} />
        <img className="field-icon-left" src={images.upload} alt="upload icon" />
        <span className='innerText absolute'>
          <>
            {
              fileUploadingLoader ?
                <Loader />
                :
                <>{values.logoUrl ? <span className="success">File Uploaded!</span> : <>Drop your files here OR&nbsp;<span> Browse</span></>}</>
            }
          </>
        </span>
      </div>
    </div>
  )
}

export default Step3;