import {Table, Column, Model, PrimaryKey, CreatedAt, UpdatedAt} from 'sequelize-typescript';

@Table
export default class User extends Model<User> {

    @PrimaryKey
    @Column
    id: number;

    @Column
    githubId: number;

    @Column
    banned: boolean;

    @Column
    accessLevel: number;

    @CreatedAt
    @Column
    createdAt: Date;

    @UpdatedAt
    @Column
    updatedAt: Date;
}