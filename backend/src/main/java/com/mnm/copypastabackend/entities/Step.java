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
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sun.istack.NotNull;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "steps")
@ApiModel
public class Step {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @ApiModelProperty(notes = "Id uniquely identifies a step", example = "1")
    private Long id;

    @Basic(optional = false)
    @Column(name = "description")
    @ApiModelProperty(notes = "The content of the step", example = "Peel orange")
    @NotBlank
    private String description;

    @Basic(optional = false)
    @Column(name = "ordering")
    @ApiModelProperty(notes = "Determines the order in which the step will be shown")
    private Integer ordering;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_fk")
    @JsonIgnore
    private Recipe recipe;
}
