import { useState } from 'react';
import { Tooltip, Avatar } from 'antd';
import { getInitials } from '../../services/utils/helpers';

const ClickupConnection = ({ value }: { value: any }) => {
  const [isImageError, setIsImageError] = useState(false);
  const profileNames = [value?.clickupUsername];
  const profileInitials = profileNames?.map(name => getInitials(name));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {value.clickupProfilePicture && !isImageError || value.clickupUsername || value.clickupEmail ? (
        <>
          {value.clickupProfilePicture && !isImageError ? (
            <img
              src={value.clickupProfilePicture}
              alt="Profile"
              width={30}
              height={30}
              style={{ borderRadius: '50%' }}
              onError={() => setIsImageError(true)} // Handle image load error
            />
          ) : (
            <Tooltip title={profileNames?.join(', ')} placement="topLeft">
              {profileInitials?.map((initial, index) => (
                <Avatar key={index} style={{ backgroundColor: '#87d068', marginRight: 5 }}>
                  {initial}
                </Avatar>
              ))}
            </Tooltip>
          )}
          <div>
            <div>{value.clickupUsername || "Username not available"}</div>
            <div style={{ color: '#8c8c8c' }}>{value.clickupEmail || "Email not available"}</div>
          </div>
        </>
      ) : (
        <div style={{ color: "lightgrey" }}>No Clickup Connection</div>
      )}
    </div>
  );
};

export default ClickupConnection;
