"""
Email notification service for Q-IRRIGATE platform.
Handles:
1. Password reset link dispatch
2. New station operator access request notifications to Admin
3. Operational role assignment confirmation to Operators
"""

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_password_reset_email(user, reset_url: str) -> bool:
    """
    Sends a password reset link to the operator's respective registered email.
    """
    recipient = user.email
    if not recipient:
        logger.warning(f"No email found for user {user.username}")
        return False

    subject = "[Q-IRRIGATE] Password Reset Authorization Request"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F6F0; margin: 0; padding: 24px; color: #181C1A; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E6E4DC; border-radius: 20px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }}
        .brand {{ display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }}
        .brand-title {{ font-size: 18px; font-weight: 800; color: #092619; }}
        .badge {{ display: inline-block; background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }}
        h2 {{ font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 12px; }}
        p {{ font-size: 13px; line-height: 1.6; color: #4B5563; margin: 0 0 16px; }}
        .btn {{ display: inline-block; background: #0E3A27; color: #FFFFFF !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin: 8px 0 20px; }}
        .info-box {{ background: #FAF9F5; border: 1px solid #EFECE3; border-radius: 12px; padding: 14px; font-size: 11px; color: #6B7280; margin-bottom: 20px; word-break: break-all; }}
        .footer {{ font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px solid #EFECE3; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">
          <span class="brand-title">Q-IRRIGATE Smart Solar Agri-Tech</span>
        </div>
        <div class="badge">Security Verification</div>
        <h2>Password Reset Authorization</h2>
        <p>Hello <strong>{user.first_name or user.username}</strong>,</p>
        <p>A request was received to reset your operator station credentials for Q-IRRIGATE. Click the button below to establish a new password:</p>
        
        <div style="text-align: center;">
          <a href="{reset_url}" class="btn">Reset Station Password</a>
        </div>
        
        <p>If the button above does not work, copy and paste this link into your browser:</p>
        <div class="info-box">{reset_url}</div>
        
        <p style="font-size: 11px; color: #6B7280;">This password reset link is single-use and will expire in 2 hours. If you did not initiate this request, please contact your farm supervisor or disregard this email.</p>
        
        <div class="footer">
          Q-IRRIGATE Platform • Autonomous Solar Agri-Tech • Track 6: Climate & Sustainability
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = strip_tags(html_content)

    try:
      msg = EmailMultiAlternatives(
          subject=subject,
          body=plain_content,
          from_email=settings.DEFAULT_FROM_EMAIL,
          to=[recipient],
      )
      msg.attach_alternative(html_content, "text/html")
      msg.send(fail_silently=False)
      logger.info(f"Password reset email sent to {recipient}")
      return True
    except Exception as e:
      logger.error(f"Failed to send password reset email to {recipient}: {e}")
      return False


def send_access_request_notification_to_admin(user, profile) -> bool:
    """
    Sends an immediate notification to the Superadmin when an operator submits
    a registration request from the login page.
    """
    admin_recipient = getattr(settings, "SUPERADMIN_EMAIL", "chhayakantamaharan@gmail.com")
    subject = f"[Q-IRRIGATE Alert] New Station Access Request: {profile.full_name or user.username}"
    users_console_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/users"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F6F0; margin: 0; padding: 24px; color: #181C1A; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E6E4DC; border-radius: 20px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }}
        .badge {{ display: inline-block; background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }}
        h2 {{ font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 12px; }}
        p {{ font-size: 13px; line-height: 1.6; color: #4B5563; margin: 0 0 16px; }}
        .details {{ background: #FAF9F5; border: 1px solid #EFECE3; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 12px; }}
        .row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #E5E7EB; }}
        .row:last-child {{ border-bottom: none; }}
        .label {{ color: #6B7280; }}
        .val {{ font-weight: 700; color: #111827; }}
        .btn {{ display: inline-block; background: #0E3A27; color: #FFFFFF !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin: 8px 0 20px; }}
        .footer {{ font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px solid #EFECE3; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div style="font-size: 18px; font-weight: 800; color: #092619; margin-bottom: 20px;">Q-IRRIGATE Admin Console</div>
        <div class="badge">Action Required • Role Assignment</div>
        <h2>New Station Operator Registered</h2>
        <p>A new operator has requested access to the Q-IRRIGATE station from the web portal. Review their credentials and assign their operational role:</p>
        
        <div class="details">
          <div class="row"><span class="label">Operator Name:</span><span class="val">{profile.full_name or user.username}</span></div>
          <div class="row"><span class="label">Email Address:</span><span class="val">{user.email}</span></div>
          <div class="row"><span class="label">Field Location:</span><span class="val">{profile.location or 'Primary Farm Station'}</span></div>
          <div class="row"><span class="label">Contact Phone:</span><span class="val">{profile.phone or 'Not provided'}</span></div>
          <div class="row"><span class="label">Current Status:</span><span class="val" style="color: #D97706;">Pending Role Assignment</span></div>
        </div>
        
        <div style="text-align: center;">
          <a href="{users_console_url}" class="btn">Open Role Management Console & Assign Role</a>
        </div>
        
        <div class="footer">
          Q-IRRIGATE Platform • Automated Superadmin Dispatch • Station Control Center
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = strip_tags(html_content)

    try:
      msg = EmailMultiAlternatives(
          subject=subject,
          body=plain_content,
          from_email=settings.DEFAULT_FROM_EMAIL,
          to=[admin_recipient],
      )
      msg.attach_alternative(html_content, "text/html")
      msg.send(fail_silently=False)
      logger.info(f"Access request email sent to admin {admin_recipient}")
      return True
    except Exception as e:
      logger.error(f"Failed to send admin notification email: {e}")
      return False


def send_role_assigned_notification_to_user(user, profile) -> bool:
    """
    Sends an email to the user when the Superadmin assigns or updates their role.
    """
    recipient = user.email
    if not recipient:
        return False

    login_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/login"
    subject = f"[Q-IRRIGATE] Operational Role Assigned: {profile.role}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F7F6F0; margin: 0; padding: 24px; color: #181C1A; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E6E4DC; border-radius: 20px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }}
        .badge {{ display: inline-block; background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }}
        h2 {{ font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 12px; }}
        p {{ font-size: 13px; line-height: 1.6; color: #4B5563; margin: 0 0 16px; }}
        .btn {{ display: inline-block; background: #0E3A27; color: #FFFFFF !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 12px; margin: 8px 0 20px; }}
        .footer {{ font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px solid #EFECE3; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div style="font-size: 18px; font-weight: 800; color: #092619; margin-bottom: 20px;">Q-IRRIGATE Smart Solar Agri-Tech</div>
        <div class="badge">Account Activated</div>
        <h2>Your Operational Role Has Been Assigned</h2>
        <p>Hello <strong>{profile.full_name or user.username}</strong>,</p>
        <p>The System Superadmin has reviewed your registration and assigned you the operational role of <strong>{profile.role}</strong>.</p>
        <p>Full access to the Q-IRRIGATE platform is now unlocked. You can sign in using your registered credentials:</p>
        
        <div style="text-align: center;">
          <a href="{login_url}" class="btn">Sign In to Control Room</a>
        </div>
        
        <div class="footer">
          Q-IRRIGATE Platform • Autonomous Solar Agri-Tech • Track 6: Climate & Sustainability
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = strip_tags(html_content)

    try:
      msg = EmailMultiAlternatives(
          subject=subject,
          body=plain_content,
          from_email=settings.DEFAULT_FROM_EMAIL,
          to=[recipient],
      )
      msg.attach_alternative(html_content, "text/html")
      msg.send(fail_silently=False)
      logger.info(f"Role assigned email sent to user {recipient}")
      return True
    except Exception as e:
      logger.error(f"Failed to send role assigned email to {recipient}: {e}")
      return False
