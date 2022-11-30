package com.mnm.copypastabackend.entities;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "recipe")
@ApiModel
public class Recipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @ApiModelProperty(notes = "Id uniquely identifies a recipe")
    private Long id;

    @Basic(optional = false)
    @Column(name = "name")
    @ApiModelProperty(notes = "The name of the recipe")
    private String name;

    @Basic
    @Column(name = "description")
    @ApiModelProperty(notes = "The description of the recipe")
    private String description;

    @Basic
    @Column(name = "servings")
    @ApiModelProperty(notes = "Amount of servings the recipe yields")
    private Integer servings;

    @OneToMany(mappedBy = "recipe")
    @ApiModelProperty(name = "quantities", dataType = "List", notes = "The quantities of the ingredients of the recipe")
    private List<Quantity> quantities;

    @ManyToMany(cascade = CascadeType.PERSIST)
    @JoinTable(
            name = "label_recipe_map",
            joinColumns = @JoinColumn(name = "recipe_fk"),
            inverseJoinColumns = @JoinColumn(name = "label_fk"))
    @ApiModelProperty(name = "labels", dataType = "Set", notes = "The labels associated with the recipe")
    private Set<Label> labels;

    @OneToMany(mappedBy = "recipe")
    @ApiModelProperty(name = "pics", dataType = "List", notes = "The pictures of the probably cooked recipe")
    private List<Pic> pics;

    @OneToMany(mappedBy = "recipe")
    @ApiModelProperty(name = "steps", dataType = "List", notes = "The steps needed to cook the recipe")
    private List<Step> steps;

    @JoinColumn(name = "created_by_user_fk")
    @ManyToOne(fetch = FetchType.EAGER)
    private User createdBy;

    @Basic(optional = false)
    @Column(name = "last_modified_at")
    @ApiModelProperty(notes = "The date and time when this recipe was last modified")
    private LocalDateTime lastModifiedAt;

    @Basic(optional = false)
    @Column(name = "likes_amount")
    @ApiModelProperty(notes = "Pre-computed sum of all likes (for better fetch-performance)")
    private Long likesAmount;

    @OneToMany(mappedBy = "recipe")
    @ApiModelProperty(name = "comments", dataType = "List", notes = "The comments that were added to this recipe")
    private List<Comment> comments;
}
