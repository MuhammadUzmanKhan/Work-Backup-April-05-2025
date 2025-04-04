import { useEffect, useState } from "react";
import { apis } from "..";
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { customNotification } from "../../components";

export const useComments = (bidId: string) => {
  const [comments, setComments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState('');
  const { user: { user } } = useSelector((state: RootState) => state);

  const getBidComments = async () => {
    try {
      const { data } = await apis.getComment(bidId);
      setComments(data?.comments || []);
    } catch (error: any) {
      console.error(error);
      customNotification.error(error?.response?.data?.message || 'Failed to fetch comments');
    }
  };

  const handleSubmit = async () => {
    if (!value) return;

    setSubmitting(true);
    await apis.createComment({
      bidId,
      userId: user?.id,
      commentText: value,
    });

    setTimeout(() => {
      setSubmitting(false);
      setValue('');
      setComments([
        ...comments,
        {
          author: user.name,
          avatar: 'https://joeschmoe.io/api/v1/random',
          content: value,
        },
      ]);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    getBidComments();
  }, [bidId]);

  return { comments, value, submitting, handleSubmit, handleChange, user };
};
