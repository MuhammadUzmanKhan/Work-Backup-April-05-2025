import { Model } from 'sequelize';
class Common {
  static findMaxCloneNumber(eventNames: string[]): number {
    let maxCloneNumber = 0;
    const clonePattern = /\[Clone (\d+)\]/;

    eventNames.forEach((name: string) => {
      const match = name.match(clonePattern);
      if (match) {
        const cloneNumber = parseInt(match[1], 10);
        if (cloneNumber > maxCloneNumber) {
          maxCloneNumber = cloneNumber;
        }
      }
    });

    return maxCloneNumber + 1;
  }

  static extractEventName(name: string): string {
    const regex = /\[\s*Clone\s*\d*\]\s*(.+)/;
    const match = name.match(regex);
    return (match ? match[1] : name).trim();
  }
  static createPlainObject<T extends Model>(
    entity: T,
    withId: boolean = false,
  ): Omit<T['_attributes'], 'id' | 'created_at' | 'deleted_at'> {
    const clonedObject = entity.get({ plain: true }) as T['_attributes'];
    if (withId) {
      clonedObject.old_id = clonedObject.id;
    }
    delete clonedObject.id;
    delete clonedObject.created_at;
    delete clonedObject.deleted_at;
    return clonedObject;
  }
}

export default Common;
