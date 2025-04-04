import { ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { EXCEPTIONS } from 'src/common/constants/exceptions';
import { ROLES } from 'src/common/constants/roles';
import { Users } from 'src/common/models/users.model';
import { Invitations } from 'src/common/models/invitations.model';
import { SendInvitationDto } from './dto/send-invite.dto';
import { UpdateInvitationDto } from './dto/update-invite.dto';
import { INVITATION_STATUS } from 'src/common/constants/status';
import FirebaseService from 'src/common/firebase/firebase.service';
import PasswordGeneratorService from 'src/common/password-generator/password-generator.service';
import { Response } from 'express';
import { Workspaces } from 'src/common/models/workspaces.model';
import { AssociatedId, ComapanySize } from 'src/types/enum';
import { MailService } from '../mail/mail.service';
import { UserTargetHistory } from 'src/common/models/user-target-history.model';
import { SOURCE } from 'src/common/constants/source';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';
import { authMessages, invitationsMessages } from 'src/common/constants/messages';

@Injectable()
export class InvitationService {
  constructor(
    public readonly mailService: MailService,
    private readonly integrationService: IntegrationsServiceHubspot

  ) { }

  public async getInvitationById(id: string) {
    return await Invitations.findOne({ where: { id } });
  }

  public async getAllInvitations() {
    return await Invitations.findAll();
  }

  public async permanentlyDeleteInvitation(id: string) {
    const invitation = await Invitations.findByPk(id);
    await invitation.destroy();
    return { success: true };
  }

  public async updateInvite(
    user: Users,
    id: string,
    updateInvitationDto: UpdateInvitationDto) {
    const invitation = await Invitations.findByPk(id);
    if (!invitation) throw new UnprocessableEntityException(EXCEPTIONS.INVITATION_NOT_FOUND);
    if (invitation.role !== ROLES.BIDDER && user.role === ROLES.MANAGER) throw new ConflictException(EXCEPTIONS.MANAGER_CAN_ONLY_UPDATE_BIDDERS_INVITE)

    if (updateInvitationDto.email) invitation.email = updateInvitationDto.email;
    if (updateInvitationDto.role) invitation.role = updateInvitationDto.role;
    await invitation.save();
    return {
      message: invitationsMessages.invitationUpdated,
      invitation: invitation.toJSON()
    };
  }

  public async sendInvitation(
    user: Users,
    sendInvitationDto: SendInvitationDto,
    res: Response
  ) {

    const newMember: { name: string, email: string, role: string, upworkTarget: number, linkedinTarget: number, companyId: string, status: string }[] = [];
    const alreadyExistedMember: { name: string, email: string, role: string }[] = [];
    const permissionRestrictedMemberAddition: { name: string, email: string, role: string }[] = [];
    const resendInvitation: { id: string, name: string, email: string, role: string }[] = [];
    const { members } = sendInvitationDto;

    if (!members.length) {
      throw new NotFoundException(invitationsMessages.invitationNotFound)
    }

    const company = await Workspaces.findByPk(user.companyId);
    if (company.companySize === ComapanySize.JUST_ME) throw new ConflictException(EXCEPTIONS.CANNOT_ADD_MEMBER_TO_JUST_ME)

    for (const element of members) {
      const alreadyInvitied = await Invitations.findOne({ where: { email: element.email, companyId: user.companyId, status: INVITATION_STATUS.PENDING } })

      if (await Users.findOne({ where: { email: element.email, companyId: user.companyId } })) {
        alreadyExistedMember.push({ ...element });
      }
      else if ((user.role === ROLES.BIDDER) || (user.role === ROLES.COMPANY_ADMIN && element.role === ROLES.SUPER_ADMIN)) {
        permissionRestrictedMemberAddition.push({ ...element })
      }
      else if (alreadyInvitied) {
        resendInvitation.push({ ...element, id: alreadyInvitied.id })
      }
      else {
        newMember.push({
          name: element.name,
          email: element.email,
          role: element.role,
          upworkTarget: element.upworkTarget,
          linkedinTarget: element.linkedinTarget,
          companyId: user.companyId,
          status: INVITATION_STATUS.PENDING
        });
      }
    }

    if (alreadyExistedMember.length) {
      res.status(HttpStatus.CONFLICT).send({ message: invitationsMessages.memeberALreadyExist, members: alreadyExistedMember });
    } else if (permissionRestrictedMemberAddition.length) {
      res.status(HttpStatus.METHOD_NOT_ALLOWED).send({ message: invitationsMessages.notAllowedToInvite, members: permissionRestrictedMemberAddition });
    }

    if (resendInvitation.length) {
      resendInvitation.forEach(async invitation => {
        await Invitations.update({ name: invitation.name, role: invitation.role, status: INVITATION_STATUS.PENDING }, { where: { email: invitation.email } })
        await this.mailService.sendEmailOnInvitaion(invitation.email, invitation.name, invitation.id, user.name)
      });
    }    

    if (newMember.length) {
      const invitations = await Invitations.bulkCreate(newMember);
      if (invitations.length) {
        invitations.forEach(async invitation => {
          await this.mailService.sendEmailOnInvitaion(invitation.email, invitation.name, invitation.id, user.name)
        });
      }
    }

    return { message: invitationsMessages.invitationSendToAll, members: newMember };

  }

  public async acceptInvitation(id: string) {
    try {
      const invitation = await Invitations.findByPk(id);

      if (!invitation) {
        throw new ConflictException(EXCEPTIONS.INVITATION_NOT_FOUND);
      }

      const { name, email, upworkTarget, linkedinTarget, companyId, role, status } = invitation;

      if (status !== INVITATION_STATUS.PENDING) {
        throw new UnprocessableEntityException(EXCEPTIONS.INVITATION_ALREADY_ACCEPTED);
      }

      let user;
      let password;

      // Check if the user already exists in Firebase
      try {
        user = await FirebaseService.app.auth().getUserByEmail(email);

        // Generate a new password and update the user's password
        password = await PasswordGeneratorService.generatePassword();

        await FirebaseService.app.auth().updateUser(user.uid, { password });

      } catch (firebaseError: any) {
        if (firebaseError.code === 'auth/user-not-found') {
          // User does not exist, create a new user
          password = await PasswordGeneratorService.generatePassword();
          user = await FirebaseService.app.auth().createUser({
            email,
            password
          });

        } else {
          // Rethrow the error if it's not a 'user-not-found' error
          throw firebaseError;
        }
      }

      const isUserExist = await Users.findOne({where: {email}})
      if(isUserExist) throw new UnprocessableEntityException('User already exists! Please contact Restat Support for further assistance.')

      // Create user record in the Users table
      const newUser = await Users.create({
        uid: user.uid,
        name,
        provider: 'auto_generated',
        upworkTarget,
        linkedinTarget,
        email,
        companyId,
        role
      });

      const company = await Workspaces.findOne({ where: { id: newUser.companyId } })

      if (!company.hubspotCompanyId) {
        await this.integrationService.createAdminHubspotEntities({
          name: company.name
        })
      }
      let fullName = newUser.name;
      let lastSpaceIndex = fullName.lastIndexOf(' ');
      let firstName = fullName.substring(0, lastSpaceIndex);
      let lastName = fullName.substring(lastSpaceIndex + 1);

      try {
        await this.integrationService.createAdminHubspotEntities({
          firstname: firstName,
          lastname: lastName,
          email: newUser.email,
          company: company.name,
          source: "Workspace"
        },
          {
            type: AssociatedId.COMPANY,
            id: company.hubspotCompanyId
          }
        )
      } catch (error) {
        console.error(error)
      }

      await UserTargetHistory.create({
        userId: newUser.id,
        type: SOURCE.UPWORK,
        target: upworkTarget || 0,
        validFrom: new Date(),
        validTo: null,
      })

      await UserTargetHistory.create({
        userId: newUser.id,
        type: SOURCE.LINKEDIN,
        target: linkedinTarget || 0,
        validFrom: new Date(),
        validTo: null,
      })


      // Send credentials via email
      await this.mailService.sendCrendentialOnRequestAccept(email, name, password);

      // Update the invitation status to accepted
      await invitation.update({
        status: INVITATION_STATUS.ACCEPTED
      });

      return {
        message: 'Invitation accepted successfully. Please check your mail for credentials'
      };
    } catch (error: any) {
      console.error(error);
      if (error instanceof HttpException) throw error
      else throw new InternalServerErrorException('An Error Occurred! Please try again later.');
    }
  }

  public async forgotPassswordEmailForUser(admin: Users, bidderId: string) {
    const bidder = await Users.findByPk(bidderId);
    if (!bidder) {
      throw new NotFoundException(authMessages.userNotFound)
    }

    let user;
    let password;
    try {
      user = await FirebaseService.app.auth().getUserByEmail(bidder.email);
      password = await PasswordGeneratorService.generatePassword();
      await FirebaseService.app.auth().updateUser(user.uid, { password });

    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/user-not-found') {
        password = await PasswordGeneratorService.generatePassword();
        user = await FirebaseService.app.auth().createUser({
          email: bidder.email,
          password
        });

      } else {
        throw firebaseError;
      }
    }


    await Users.update({ uid: user.uid, provider: 'password' }, { where: { id: bidder.id } })

    await this.mailService.sendBidderForgotPassswordCredentials(admin.name, bidder.email, bidder.name, password);

    return { message: invitationsMessages.forgetPasswordEmailSent };
  }

  public async rejectInvitation(id: string) {
    const invitation = await Invitations.findByPk(id);

    if (!invitation) {
      throw new ConflictException(EXCEPTIONS.INVITATION_NOT_FOUND);
    }

    await invitation.update({
      status: INVITATION_STATUS.REJECTED
    });

    return {
      message: invitationsMessages.invitationRejected
    }

  }
}
