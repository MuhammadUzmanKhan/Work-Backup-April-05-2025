import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { linkMessages } from "src/common/constants/messages";
import { Links } from "src/common/models/links.model";

@Injectable()
export class LinkService {
  constructor() { }

  public async createLink(
    workspaceId: string,
    linkDto: { title: string; url: string }[],
    portfolioId: string
  ) {
    try {
      const existingLinks = await Links.findAll({
        where: { workspaceId, url: linkDto.map((link) => link.url) },
      });

      const existingUrls: string[] = [];

      const duplicateUrls = linkDto.some((link) => {
        if (existingUrls.includes(link.url)) {
          return true;
        }
        existingUrls.push(link.url);
        return false;
      });
      if (duplicateUrls) {
        return {
          message: "error",
          duplicateUrls,
        };
      }
      if (existingLinks.length > 0) {
        return {
          message: "error",
          existingLinks,
        };
      }

      const linksToCreate = linkDto.map((link) => ({
        ...link,
        portfolioId,
        workspaceId,
      }));
      const createdLinks = await Links.bulkCreate(linksToCreate);

      return {
        message: linkMessages.linkCreated,
        createdLinks,
      };
    } catch (err) {
      return {
        message: linkMessages.linkCreateError,
        error: err,
      };
    }
  }

  public async updatePorfolioLinks(
    workspaceId: string,
    portfolioId: string,
    portfolioLinks: Array<any>
  ) {
    const { links } = await this.getPortfolioLinks(workspaceId, portfolioId);
    // make the array of just urls
    const portfolioLinksUrls = portfolioLinks.map((link) => link.url);
    const portolioLinksTitles = portfolioLinks.map((link) => link.title)
    const linksUrls = links.map((link) => link.url);
    const linksTitles = links.map((link) => link.title);

    // Use filter to find links that are in links but not in portfolioLinks
    const linksToDelete = links.filter(
      (link) => !portfolioLinksUrls.includes(link.url) || !portolioLinksTitles.includes(link.title)
    );
    const { deletionError } = await this.deleteLinks(linksToDelete);
    // Use filter to find portfolioLinks that are in links but not in links
    const linksToAdd = portfolioLinks.filter(
      (link) => !linksUrls.includes(link.url) || !linksTitles.includes(link.title)
    );
    const { error, existingLinks, duplicateUrls } = await this.createLink(
      workspaceId,
      linksToAdd,
      portfolioId,
    );
    return {
      error,
      existingLinks,
      duplicateUrls,
      deletionError,
    };
  }

  public async deleteLinks(links: Array<any>) {
    try {
      const linksToDelete = await Links.findAll({
        where: { url: links.map((link) => link.url) },
      });
      if (linksToDelete.length === 0) {
        throw new NotFoundException(linkMessages.linkNotFound);
      }

      await Links.destroy({
        where: {
          id: linksToDelete.map((link) => link.id),
        },
      });

      return {
        message: linkMessages.linkDeleted,
        deletedLinks: linksToDelete,
      };
    } catch (err) {
      return {
        message: linkMessages.linkDeleteError,
        deletionError: err,
      };
    }
  }

  public async getPortfolioLinks(workspaceId: string, portfolioId: string) {
    try {
      const links = await Links.findAll({ where: { workspaceId, portfolioId } });
      return {
        message: linkMessages.linkPortfolioFetched,
        links,
      };
    } catch (error) {
      throw new InternalServerErrorException(linkMessages.linkPortfolioFetchedError);
    }
  }

  public async deletePortfolioLinks(portfolioId: string) {
    try {
      await Links.destroy({ where: { portfolioId } });
    } catch (error) {
      throw new InternalServerErrorException(linkMessages.linkPortfolioDeleteError);
    }
  }
}
