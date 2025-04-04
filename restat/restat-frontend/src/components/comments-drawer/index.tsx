import { Drawer } from "antd";
import { Avatar, Button, Form, Input, List } from "antd";
import React from "react";
import { Comment } from "@ant-design/compatible";
import { useComments } from "../../services/hooks/useComments";

const { TextArea } = Input;

interface EditorProps {
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  submitting: boolean;
  value: string;
}

const CommentList = ({ comments }: { comments: any[] }) => (
  <>
    <div className="text-primary font-bold">
      {comments.length} {comments.length > 1 ? 'Comments' : comments.length === 1 ? 'Comment' : 'Comments'}
    </div>
    <hr />
    <List
      dataSource={comments}
      className="overflow-auto h-[75%]"
      itemLayout="horizontal"
      renderItem={(items) => (
        <Comment
          avatar={<Avatar src={items.avatar || 'https://joeschmoe.io/api/v1/random'} alt={items.author} />}
          author={items?.user?.name || items?.author}
          content={items?.commentText || items?.content}
        />
      )}
    />
  </>
);

const Editor = ({ onChange, onSubmit, submitting, value }: EditorProps) => (
  <div>
    <Form.Item style={{ marginBottom: "10px" }}>
      <TextArea rows={4} onChange={onChange} value={value} />
    </Form.Item>
    <Form.Item style={{ marginBottom: 0 }}>
      <Button
        htmlType="submit"
        loading={submitting}
        onClick={onSubmit}
        type="primary"
        style={{ backgroundColor: "blueviolet", marginBottom: 0 }}
      >
        Add Comment
      </Button>
    </Form.Item>
  </div>
);

export const CommentsDrawer = ({ onClose, open, bidId }: { onClose: () => void; open: boolean; bidId: string }) => {
  const { comments, value, submitting, handleSubmit, handleChange } = useComments(bidId);

  return (
    <Drawer title="Comment Section" onClose={onClose} open={open}>
      <CommentList comments={comments} />
      <Comment
        avatar={<Avatar src="https://joeschmoe.io/api/v1/random" alt="Han Solo" />}
        content={
          <Editor onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} value={value} />
        }
      />
    </Drawer>
  );
};
