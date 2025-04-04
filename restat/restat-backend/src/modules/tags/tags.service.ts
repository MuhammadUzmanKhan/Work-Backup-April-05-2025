import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Source } from 'src/types/enum';
import { Tags } from "src/common/models/tags.model";
import { Op, Sequelize } from "sequelize";
import { tagMessages } from "src/common/constants/messages";

@Injectable()
export class TagService {

  constructor() { }

  public async createTags(
    _tags: string[] | any[],
    source: Source,
    workspaceId: string,
  ) {
    try {
      const tags: string[] = [];
      _tags = _tags
        .map((tag) =>
          typeof tag === "string"
            ? tag.replace("'", "")
            : tag.value.replace("'", "")
        )
        .filter((tag) => tag.length < 250);
      const seenTags: Set<string> = new Set();
      for (const tag of _tags) {
        const normalizedTag = tag.replace(/[ .]/g, "").toLowerCase();

        if (!seenTags.has(normalizedTag)) {
          const similarTags = tags.filter((t) => isSimilarTag(t, tag));

          if (similarTags.length === 0) {
            seenTags.add(normalizedTag);
            tags.push(tag);
          }
        }
      }
      // in some records of mapped data, the tags are not an array of string but they are objects having the property value and the value has the name of the tag like this [{value: "nodejs"}, {value: "javascript"}] etc.
      const tagsWithSource = tags.map((tag: any) => ({
        name: tag,
        source,
        workspaceId
      }));
      // Convert tag names to lowercase for case-insensitive comparison and replace . and space with empty string, this way the similar tags like node js nodejs and node.js won't be created three times but it will create the first occurence of the similar tags and then compare if the tag already exists
      const standardizedTags = tags.map((tag: any) => {
        return tag.replace(/[ .]/g, "").toLowerCase();
      });

      const tagsAlreadyExist = await Tags.findAll({
        where: Sequelize.literal(
          `lower(regexp_replace("name", '[ .]', '', 'g')) IN (${standardizedTags
            .map((tag) => `'${tag}'`)
            .join(",")}) AND "workspaceId" = '${workspaceId}'`
        ),
        attributes: ["name", "id", "source"],
      });

      const existingTagNames = tagsAlreadyExist.map((tag) =>
        tag.name.replace(/[ .]/g, "").toLowerCase()
      );
      // Filter out the tags that already exist from the tags to create
      const tagsToCreate = tagsWithSource.filter(
        ({ name }) =>
          !existingTagNames.includes(name.replace(/[ .]/g, "").toLowerCase())
      )
      // Bulk insert the tags
      const createdTags = await Tags.bulkCreate(tagsToCreate);

      // Combine the arrays to get the union
      const allTags = tagsAlreadyExist.concat(createdTags);
      return { message: tagMessages.tagCreated, tags: allTags };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        tagMessages.tagCreateError
      );
    }
  }

  public async getAllTags(workspaceId: string, search: string, theTags: string, page: number = 1) {
    try {
      const tagsPerPage = 100;
      // Calculate offset based on page and pageSize
      const offset = (page - 1) * tagsPerPage;

      const options: any = {
        offset,
        limit: tagsPerPage,
        where: {
          workspaceId
        }, // Initialize options.where as an empty object
      };

      if (search) {
        search = search.trim();
        options.where.name = {
          [Op.iLike]: `%${search}%`, // Case-insensitive search
        };
      }

      if (theTags) {
        const tagVariations = decodeURIComponent(theTags).split(",").map((tag) => tag.trim());

        const standardizedTags = tagVariations.map((tag) =>
          tag.replace(/[ .]/g, "").toLowerCase()
        );

        const sequelizeLiteral = Sequelize.literal(
          `lower(regexp_replace("name", '[ .]', '')) IN (${standardizedTags
            .map((tag) => `'${tag}'`)
            .join(",")}) AND "workspaceId" = '${workspaceId}'`
        );

        // Combine the conditions with an OR condition
        options.where[Op.or] = sequelizeLiteral;
      }

      let tags = await Tags.findAll(options);
      let allTags = await Tags.findAll({
        where: { workspaceId },
        offset,
        limit: tagsPerPage,
      });
      let tagsCount = await Tags.count({
        where: options.where,
      });
      let allTagsCount = await Tags.count({ where: { workspaceId } });
      return {
        success: true,
        message: tagMessages.allTagsFetched,
        tags,
        allTags,
        allTagsCount,
        tagsCount,
        tagsPerPage,
      };
    } catch (err) {
      console.error(tagMessages.allTagsFetchedError, err);
      throw new InternalServerErrorException(
        tagMessages.allTagsFetchedError
      );
    }
  }

  public async getAllPortfolioTags(portfolioTags: any[]) {
    try {
      const tags = await Tags.findAll({
        where: { id: portfolioTags.map((tag) => tag.tagId) },
      });
      return {
        message: tagMessages.allTagsFetched + " for portfolio",
        tags,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        tagMessages.allTagsFetchedError + " for portfolio"
      );
    }
  }

  public async getAllTemplateTags(templateTags: any[]) {
    try {
      const tags = await Tags.findAll({
        where: { id: templateTags.map((tag) => tag.tagId) },
      });
      return {
        message: tagMessages.allTagsFetched + " for template",
        tags,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        tagMessages.allTagsFetchedError + " for template"
      );
    }
  }

  public async getAllJobTags(jobTags: any[]) {
    try {
      const tagIds = jobTags.map((jobTag) => jobTag.tagId);
      // Use the extracted tagId values to find the corresponding tags from the Tags table
      const tags = await Tags.findAll({ where: { id: tagIds } });
      return {
        message: tagMessages.allTagsFetched + " for job",
        tags,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        tagMessages.allTagsFetchedError + " for job"
      );
    }
  }
}

// Helper function to check for similar tags
const isSimilarTag = (tag1: string, tag2: string) => {
  const normalizedTag1 = tag1.replace(/[ .]/g, "").toLowerCase();
  const normalizedTag2 = tag2.replace(/[ .]/g, "").toLowerCase();
  return normalizedTag1 === normalizedTag2;
};
