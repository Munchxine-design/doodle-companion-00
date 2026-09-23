import { useState } from "react";
import { MessageCircle, Reply, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Window } from "@/components/Window";
import { useSite, renderTextWithEmojis, type Comment } from "@/context/SiteContext";

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return d;
  } catch {
    return "";
  }
}

function CommentItem({ comment }: { comment: Comment }) {
  const { addReply, isAdmin, profile, customEmojis } = useSite();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);

  const handleReply = () => {
    if (!replyText.trim()) return;
    addReply(comment.id, {
      author: isAdmin ? profile.username : "Anónimo",
      avatar: isAdmin ? profile.avatar : "",
      text: replyText.trim(),
    });
    setReplyText("");
    setShowReply(false);
  };

  return (
    <article className="comment">
      <div className="post-author">
        {comment.avatar ? (
          <img src={comment.avatar} alt={comment.author} />
        ) : (
          <span className="comment-avatar-fallback" />
        )}
        <div>
          <strong>{comment.author} {comment.isAdmin && <small>ADMIN</small>}</strong>
          <span>{timeAgo(comment.createdAt)}</span>
        </div>
      </div>
      <p className="comment-text">{renderTextWithEmojis(comment.text, customEmojis)}</p>
      <div className="comment-actions">
        <button className="comment-action-btn" onClick={() => setShowReply(!showReply)}>
          <Reply size={12} /> Responder
        </button>
      </div>
      {comment.replies.length > 0 && (
        <div className="replies">
          {comment.replies.map((r) => (
            <div className="reply" key={r.id}>
              <div className="post-author">
                {r.avatar ? <img src={r.avatar} alt={r.author} /> : <span className="comment-avatar-fallback" />}
                <div>
                  <strong>{r.author}</strong>
                  <span>{timeAgo(r.createdAt)}</span>
                </div>
              </div>
              <p className="comment-text">{renderTextWithEmojis(r.text, customEmojis)}</p>
            </div>
          ))}
        </div>
      )}
      {showReply && (
        <div className="reply-input">
          <Textarea
            placeholder="Tu respuesta..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          {isAdmin && customEmojis.length > 0 && (
            <div className="emoji-picker-wrapper">
              <button className="comment-action-btn" onClick={() => setShowEmojis(!showEmojis)}>
                <Smile size={14} /> Emojis
              </button>
              {showEmojis && (
                <div className="emoji-picker">
                  {customEmojis.map((e) => (
                    <button
                      key={e.id}
                      className="emoji-option"
                      onClick={() => { setReplyText((prev) => prev + `[:${e.id}:]`); setShowEmojis(false); }}
                      title={e.name}
                    >
                      <img src={e.image} alt={e.name} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button variant="signal" size="sm" onClick={handleReply}><Send size={12} /> Enviar</Button>
        </div>
      )}
    </article>
  );
}

export function CommentWall() {
  const { comments, addComment, isAdmin, profile, customEmojis } = useSite();
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    addComment({
      author: isAdmin ? profile.username : "Anónimo",
      avatar: isAdmin ? profile.avatar : "",
      text: text.trim(),
      isAdmin,
    });
    setText("");
  };

  return (
    <Window title="Muro de Maxine" className="wall">
      <article className="post">
        <div className="post-author">
          <img src={profile.avatar} alt="Maxine" />
          <div><strong>{profile.username} <small>ADMIN / DEV :3C</small></strong><span>14 sept 2026, 0:24</span></div>
        </div>
        <p>¡Haii! Bienvenidos al muro oficial de la web.</p>
      </article>
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} />
      ))}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isAdmin ? `Comentar como ${profile.username}...` : "Tu comentario anónimo..."}
      />
      <div className="comment-input-row">
        {isAdmin && customEmojis.length > 0 && (
          <div className="emoji-picker-wrapper">
            <button className="comment-action-btn" onClick={() => setShowEmojis(!showEmojis)}>
              <Smile size={14} /> Emojis
            </button>
            {showEmojis && (
              <div className="emoji-picker">
                {customEmojis.map((e) => (
                  <button
                    key={e.id}
                    className="emoji-option"
                    onClick={() => { setText((prev) => prev + `[:${e.id}:]`); setShowEmojis(false); }}
                    title={e.name}
                  >
                    <img src={e.image} alt={e.name} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Button variant="signal" onClick={handleSubmit}><MessageCircle /> Enviar</Button>
      </div>
      {isAdmin && <p className="window-copy" style={{ fontSize: "10px" }}>Comentando como <strong>{profile.username}</strong> ♡</p>}
    </Window>
  );
}
