package com.mnm.copypastabackend.entities;

import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sun.istack.NotNull;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "pics")
@ApiModel
public class Pic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @ApiModelProperty(notes = "Id uniquely identifies a picture", example = "1")
    private Long id;

    @Basic(optional = false)
    @Column(name = "name")
    @ApiModelProperty(notes = "The original name of the picture", example = "Delicious cake")
    private String name;

    @Column(name = "internal_uuid")
    @ApiModelProperty(notes = "The internal name given to the file at upload/creation to make it unique", example = "a58c6d00-ee41-4448-a145-eff5bb928258")
    @JsonIgnore
    private String internalUUID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_fk")
    @JsonIgnore
    private Recipe recipe;

    @Basic
    @Column(name = "rotation")
    @ApiModelProperty(notes = "Number of degrees the image is rotated by")
    private Integer rotation;

    @JsonIgnore
    @OneToOne(mappedBy = "pic")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_fk")
    private User uploadedBy;
}
